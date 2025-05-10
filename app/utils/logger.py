import logging

def setup_logger(debug: bool = False):
    log_level = logging.DEBUG if debug else logging.INFO

    logger = logging.getLogger("Scanalyzer")
    logger.setLevel(log_level)

    # 🧹 Clean existing handlers to avoid duplicates
    if logger.hasHandlers():
        logger.handlers.clear()

    # Add new console handler
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # 🚫 Prevent bubbling up to root logger
    logger.propagate = False

    # Optionally: hook Uvicorn logs into same handler
    for name in ("uvicorn.access", "uvicorn.error"):
        uvicorn_logger = logging.getLogger(name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(handler)
        uvicorn_logger.setLevel(log_level)
        uvicorn_logger.propagate = False

    return logger
