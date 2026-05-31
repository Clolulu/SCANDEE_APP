import sqlite3
import os

DB_PATH = 'db.sqlite3'
if not os.path.exists(DB_PATH):
    print('No database file found at', DB_PATH)
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
all_tables = [r[0] for r in cur.fetchall()]
print('tables:', all_tables)

def show_cols(table):
    cur.execute(f"PRAGMA table_info('{table}')")
    cols = cur.fetchall()
    print(f"columns for {table}:")
    for col in cols:
        print('  ', col)

for t in ['marketplace_payout', 'marketplace_vendorprofile']:
    if t in all_tables:
        show_cols(t)
    else:
        print(f"Table {t} not found")

conn.close()
