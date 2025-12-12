import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5001/api"

def main():
    print("Starting Registration Fix Verification...")
    
    ts = int(time.time())
    username = f"user_{ts}"
    email = f"user_{ts}@example.com"
    password = "password"
    
    # 1. Register (Should be success)
    print(f"\nRegistering {username}...")
    try:
        res = requests.post(f"{BASE_URL}/register", json={"username": username, "email": email, "password": password})
        if res.status_code == 201:
            print("SUCCESS: Registration successful.")
        else:
            print(f"FAILED: Registration failed: {res.text}")
            sys.exit(1)
    except Exception as e:
        print(f"FAILED: Request error: {e}")
        sys.exit(1)

    # 2. Login (Should success)
    print("\nAttempting login...")
    res = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
    if res.status_code == 200:
        print("SUCCESS: Login successful.")
    else:
        print(f"FAILED: Login failed: {res.text}")
        sys.exit(1)

    print("\nVerification Passed!")

if __name__ == "__main__":
    main()
