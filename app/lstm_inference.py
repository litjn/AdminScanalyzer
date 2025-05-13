# app/lstm_inference.py
"""Binary LSTM‑based log classifier for **Scanalyzer**.

*   Loads the pre‑trained LSTM + vocabulary saved by the Colab notebook.
*   Accepts a full MongoDB log **dict** (same fields you store in `logs`).
*   Flattens it into a single space‑separated string the model understands.
*   Returns **"normal"** or **"anomaly"** (binary).

"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Sequence, Union, Optional

import torch
from datetime import datetime

from app.models.full_log import FullLogEntry
from app.models.log_model import LogEntry


# ─────────────────────────────── Vocabulary ──────────────────────────────── #

class Vocab:
    """Token ⇄ index lookup with `<pad>` and `<unk>` already included."""

    def __init__(self, mapping: Dict[str, int]):
        self.stoi = mapping
        self.itos = {i: t for t, i in mapping.items()}

    def encode(self, tokens: List[str], pad_len: int = 50) -> torch.Tensor:
        idxs = [self.stoi.get(t, self.stoi["<unk>"]) for t in tokens[:pad_len]]
        idxs += [self.stoi["<pad>"]] * (pad_len - len(idxs))
        return torch.tensor(idxs, dtype=torch.long)


# ───────────────────────────────── Model ──────────────────────────────────── #

class LogLSTM(torch.nn.Module):
    """128‑d embedding → 128‑d LSTM → 2‑way linear head."""

    def __init__(self, vocab_size: int, embed_dim: int = 128, hidden_dim: int = 128, num_classes: int = 2):
        super().__init__()
        self.embed = torch.nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = torch.nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.classif = torch.nn.Linear(hidden_dim, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # (batch, seq_len)
        emb = self.embed(x)
        _, (h, _) = self.lstm(emb)
        return self.classif(h[-1])                       # (batch, num_classes)


# ─────────────────────── Cached loader (vocab + model) ────────────────────── #

# ───────────────────────────  compatibility shim  ────────────────────────────
def _remap_legacy_keys(sd: dict) -> dict:
    """Rename old checkpoint keys → new module names."""
    out = {}
    for k, v in sd.items():
        if k.startswith("embedding."):          # → embed.*
            out["embed." + k[len("embedding."):]] = v
        elif k.startswith("fc."):               # → classif.*
            out["classif." + k[len("fc."):]] = v
        else:
            out[k] = v
    return out

# ─────────────────────────── get_model_and_vocab  ────────────────────────────
@lru_cache(maxsize=1)
def get_model_and_vocab():
    root = Path(__file__).resolve().parent.parent / "models"

    with open(root / "vocab.json", "r") as f:
        vocab = Vocab(json.load(f))

    model = LogLSTM(len(vocab.stoi))
    ckpt  = torch.load(root / "log_lstm_model.pt", map_location="cpu")

    if isinstance(ckpt, LogLSTM):          # full model
        model = ckpt

    else:                                  # state‑dict or checkpoint dict
        state = ckpt.get("model_state_dict", ckpt)
        state = _remap_legacy_keys(state)  # ← NEW
        model.load_state_dict(state, strict=False)

    model.eval()
    return model, vocab




# ───────────────────────────── Utils / Flattening ─────────────────────────── #

def _norm(s: Optional[str]) -> str:
    """Normalize text for log flattening."""
    return str(s).replace("\n", "\\n").replace("\r", "\\r") if s else ""


def flatten_record(log_entry: LogEntry) -> str:
    """
    Flatten a `LogEntry` into one space‑separated line that the LSTM
    understands.  All JSON keys become `key=value` tokens.

    • Lists   → "a b c"
    • datetimes → ISO 8601 strings
    • None    → skipped
    """
    record_dict = log_entry.model_dump(by_alias=True)

    parts: List[str] = []
    for k, v in record_dict.items():
        if v is None:
            continue
        if isinstance(v, list):           # join message or any list field
            v = " ".join(map(str, v))
        elif isinstance(v, datetime):     # make timestamps deterministic
            v = v.isoformat()

        parts.append(f"{k}={_norm(v)}")   # _norm handles newlines etc.

    return " ".join(parts).strip()

# ───────────────────────────── Public helpers ─────────────────────────────── #

def predict(log_line: str) -> str:
    """Classify a *plain‑text* log line → "normal" / "anomaly"."""
    model, vocab = get_model_and_vocab()
    tokens = log_line.split()
    x = vocab.encode(tokens).unsqueeze(0)  # (1, seq_len)

    with torch.no_grad():
        logits = model(x)
        label_idx = torch.argmax(logits, dim=-1).item()
    return "anomaly" if label_idx else "normal"


def predict_record(rec: LogEntry) -> str:
    """Entry point for FastAPI — accepts the raw Mongo record."""
    return predict(flatten_record(rec))
