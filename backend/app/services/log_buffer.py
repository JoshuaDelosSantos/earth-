"""In-memory log buffer for fetch and system logs — serves the REST log endpoints."""

from collections import deque

MAX_ENTRIES = 1000

_fetch_logs: deque[dict] = deque(maxlen=MAX_ENTRIES)
_system_logs: deque[dict] = deque(maxlen=MAX_ENTRIES)


def add_fetch_log(entry: dict) -> None:
    _fetch_logs.append(entry)


def add_system_log(entry: dict) -> None:
    _system_logs.append(entry)


def get_fetch_logs(offset: int = 0, limit: int = 100) -> tuple[list[dict], int]:
    items = list(_fetch_logs)
    total = len(items)
    return items[offset : offset + limit], total


def get_system_logs(offset: int = 0, limit: int = 100) -> tuple[list[dict], int]:
    items = list(_system_logs)
    total = len(items)
    return items[offset : offset + limit], total
