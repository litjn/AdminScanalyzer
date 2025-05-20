# ────────────────────────────────────────────────────────────────────────
#  🔸 app/utils/logger.py
# ────────────────────────────────────────────────────────────────────────

"""Project‑wide logger factory – avoids duplicate handlers."""
from __future__ import annotations

import logging
from typing import Optional


def setup_logger(name: str = "Scanalyzer", *, debug: bool = False) -> logging.Logger:  # noqa: D401
    """Return a module‑level logger with a single console handler.

    Call this at module scope once per file:
    >>> logger = setup_logger(__name__)
    """

    log_level = logging.DEBUG if debug else logging.INFO

    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Clean existing handlers only for our named logger, not root
    if logger.handlers:
        logger.handlers.clear()

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
    logger.addHandler(handler)

    logger.propagate = False  # keep root logger quiet
    return logger

__all__ = ["setup_logger"]