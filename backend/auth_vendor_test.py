import json
import sys
import time
import urllib.error
import urllib.request


def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print("ERROR", e.code, body)
        sys.exit(1)
    except Exception as e:
        print("EXCEPTION", e)
        sys.exit(1)


def run():
    base = "http://127.0.0.1:8000/api/auth"
    uniq = int(time.time())
    email = f"vendortest{uniq}@example.com"
    print("Register vendor", email)
    status, data = post(
        base + "/register/vendor/",
        {
            "email": email,
            "password": "Test12345",
            "shop_name": "Test Shop",
            "owner_name": "Test Owner",
            "phone_number": "0123456789",
        },
    )
    print("vendor register status", status, data.keys())
    status, data = post(base + "/login/", {"email": email, "password": "Test12345"})
    print("vendor login status", status, data["user"]["email"], "role", data["user"]["role"])
    status, data = post(base + "/login/", {"email": "vendor@test.com", "password": "12345678"})
    print("demo vendor login status", status, data["user"]["email"], "role", data["user"]["role"])


if __name__ == "__main__":
    run()
