import sqlite3
import os
import logging
from threading import Lock

logger = logging.getLogger(__name__)

class FakeRedis:
    """SQLite-backed fallback for Redis metrics so the demo works without a Redis server."""
    _file_path = "fake_redis.db"
    _lock = Lock()

    def __init__(self):
        with self._lock:
            self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self._file_path, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_db(self):
        conn = self._get_conn()
        try:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS kv(
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            ''')
            conn.commit()
        finally:
            conn.close()

    def ping(self):
        return True

    def incr(self, name, amount=1):
        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute('''
                    INSERT INTO kv (key, value)
                    VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + ?
                ''', (name, str(amount), amount))
                conn.commit()
                cursor = conn.execute("SELECT value FROM kv WHERE key = ?", (name,))
                row = cursor.fetchone()
                return int(row[0]) if row else 0
            finally:
                conn.close()

    def get(self, name):
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT value FROM kv WHERE key = ?", (name,))
            row = cursor.fetchone()
            return row[0] if row else None
        finally:
            conn.close()

    def setex(self, name, time, value):
        with self._lock:
            conn = self._get_conn()
            try:
                conn.execute('''
                    INSERT INTO kv (key, value)
                    VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = ?
                ''', (name, str(value), str(value)))
                conn.commit()
            finally:
                conn.close()

    def xlen(self, name):
        return 0 # Fake stream length

_fake_redis_instance = FakeRedis()

def get_redis_client(url=None, decode_responses=True):
    import redis
    try:
        r = redis.Redis.from_url(url or "redis://localhost:6379/0", decode_responses=decode_responses)
        r.ping()
        return r
    except Exception as e:
        logger.warning(f"Using FakeRedis fallback because real Redis failed: {e}")
        return _fake_redis_instance
