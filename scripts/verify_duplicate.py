import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5001/api"

def main():
    print("Verifying Duplicate Email Protection...")
    
    ts = int(time.time())
    username1 = f"userA_{ts}"
    username2 = f"userB_{ts}"
    email = f"shared_{ts}@example.com"
    password = "password"
    
    # 1. Register First User
    print(f"\nRegistering {username1} with {email}...")
    res = requests.post(f"{BASE_URL}/register", json={"username": username1, "email": email, "password": password})
    if res.status_code == 201:
        print("SUCCESS: First registration successful.")
    else:
        print(f"FAILED: First registration failed: {res.text}")
        sys.exit(1)

    # 2. Register Second User with SAME Email
    print(f"\nRegistering {username2} with SAME email {email}...")
    res = requests.post(f"{BASE_URL}/register", json={"username": username2, "email": email, "password": password})
    
    if res.status_code == 400:
        print(f"SUCCESS: Duplicate email rejected. Response: {res.json()}")
        if res.json().get("msg") == "Email already exists":
            print("Message is correct.")
        else:
            print(f"WARNING: Unexpected message: {res.json()}")
    else:
        print(f"FAILED: Expected 400, got {res.status_code}. Response: {res.text}")
        sys.exit(1)

if __name__ == "__main__":
    main()
