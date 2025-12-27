import csv, os, math, random, uuid
from datetime import datetime, timedelta
import argparse

# ---------- knobs (also allow CLI flags) ----------
DEFAULT_NUM_SALES      = 1_000_000   # total transactions
DEFAULT_AVG_ITEMS      = 3.0         # mean line items per sale
DEFAULT_SHARD_SALES    = 100_000     # sales rows per shard file
DEFAULT_NUM_PRODUCTS   = 5_000       # unique products in catalog
DEFAULT_START_DATE     = "2024-09-01"
DEFAULT_DAYS           = 30          # window to spread timestamps
PROMOTIONS = ["None", "BOGO (Buy One Get One)", "Discount on Selected Items"]
MEMBERS    = ["Yes", "No"]
STORES = [
    ("POD-TEMPE",  "POD Market – Tempe"),
    ("POD-POLY",   "POD Market – Polytechnic"),
    ("POD-WV",     "POD Market – West Valley"),
    ("POD-DTPHX",  "POD Market – Downtown Phoenix"),
]

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out", help="output directory")
    ap.add_argument("--num_sales", type=int, default=DEFAULT_NUM_SALES)
    ap.add_argument("--avg_items", type=float, default=DEFAULT_AVG_ITEMS)
    ap.add_argument("--shard_sales", type=int, default=DEFAULT_SHARD_SALES)
    ap.add_argument("--num_products", type=int, default=DEFAULT_NUM_PRODUCTS)
    ap.add_argument("--start_date", default=DEFAULT_START_DATE)
    ap.add_argument("--days", type=int, default=DEFAULT_DAYS)
    ap.add_argument("--seed", type=int, default=42)
    return ap.parse_args()

def daterange(start_dt, span_days, rnd: random.Random):
    # uniform day/hour/min within window, store open 8:00–22:00
    day = rnd.randint(0, span_days)
    hour = rnd.randint(8, 21)
    minute = rnd.randint(0, 59)
    return start_dt + timedelta(days=day, hours=hour, minutes=minute)

def main():
    args = parse_args()
    rnd = random.Random(args.seed)
    os.makedirs(args.out, exist_ok=True)

    # ---------- stores.csv ----------
    with open(os.path.join(args.out, "stores.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["store_id","code","name","region"])
        for code, name in STORES:
            w.writerow([str(uuid.uuid4()), code, name, "us-west1"])  # region label (logical)

    # ---------- products.csv ----------
    # product names: PXXXX to keep unique + readable; you can replace with real catalogs later
    with open(os.path.join(args.out, "products.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["product_id","name"])
        for i in range(args.num_products):
            w.writerow([str(uuid.uuid4()), f"Product-{i:05d}"])

    # Map product ids into a list for sampling
    # (for huge catalogs, sample by index and regenerate name; we keep simple here)
    # We'll also keep a local cache of product_ids for speed.
    product_ids = []
    with open(os.path.join(args.out, "products.csv"), newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            product_ids.append(row["product_id"])

    # ---------- sales_*.csv and sale_items_*.csv ----------
    start_dt = datetime.strptime(args.start_date, "%Y-%m-%d")
    num_shards = math.ceil(args.num_sales / args.shard_sales)

    # simple price generator: skewed towards mid-range
    def draw_total():
        # simulate basket total; tweak as needed
        base = rnd.triangular(3.0, 40.0, 15.0)
        return round(base, 2)

    # draw number of items per sale from Poisson-like (approx via clamped normal)
    def draw_items():
        x = max(1, int(rnd.normalvariate(args.avg_items, 1.0)))
        return min(x, 12)

    # weighted store mix (can tweak if you want one store busier)
    store_weights = [1.0, 0.9, 0.8, 1.1]
    store_choices = [s[0] for s in STORES]
    store_code_bag = []
    for code, w in zip(store_choices, store_weights):
        store_code_bag += [code] * int(w * 100)

    for shard_idx in range(1, num_shards+1):
        shard_sales_path = os.path.join(args.out, f"sales_{shard_idx:06d}.csv")
        shard_items_path = os.path.join(args.out, f"sale_items_{shard_idx:06d}.csv")

        with open(shard_sales_path, "w", newline="") as fs, \
             open(shard_items_path, "w", newline="") as fi:

            ws = csv.writer(fs); wi = csv.writer(fi)
            ws.writerow(["sale_id","store_code","total","txn_ts","promotion","member"])
            wi.writerow(["sale_id","product_id","qty"])

            rows_this_shard = min(args.shard_sales, args.num_sales - (shard_idx-1)*args.shard_sales)

            for _ in range(rows_this_shard):
                sale_id = str(uuid.uuid4())
                store_code = rnd.choice(store_code_bag)
                txn_ts = daterange(start_dt, args.days, rnd).strftime("%Y-%m-%d %H:%M:%S")
                promotion = rnd.choices(PROMOTIONS, weights=[0.45, 0.30, 0.25])[0]
                member = rnd.choices(MEMBERS, weights=[0.55, 0.45])[0]
                total = draw_total()
                ws.writerow([sale_id, store_code, f"{total:.2f}", txn_ts, promotion, member])

                n_items = draw_items()
                for _j in range(n_items):
                    pid = rnd.choice(product_ids)
                    qty = 1 if rnd.random() < 0.9 else rnd.randint(2, 4)
                    wi.writerow([sale_id, pid, qty])

        print(f"wrote {shard_sales_path} and {shard_items_path}")

if __name__ == "__main__":
    main()
