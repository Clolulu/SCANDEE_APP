import sys
import urllib.request

urls = [
    "http://localhost:3000/login",
    "http://localhost:3000/register/tourist",
    "http://localhost:3000/register/vendor",
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            print(url, r.status)
    except Exception as e:
        print("ERROR", url, e)
        sys.exit(1)
