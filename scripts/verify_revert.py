import requests
import sys
import time

BASE_URL = "http://localhost:5001/api"

def main():
    print("Starting Reverted Registration Verification...")
    
    ts = int(time.time())
    username = f"user_{ts}"
    email = f"user_{ts}@example.com"
    password = "password"
    
    # 1. Register (Should be immediate success)
    print(f"\nRegistering {username}...")
    res = requests.post(f"{BASE_URL}/register", json={"username": username, "email": email, "password": password})
    if res.status_code == 201:
        print("SUCCESS: Registration successful.")
    else:
        print(f"FAILED: Registration failed: {res.text}")
        sys.exit(1)

    # 2. Login (Should success immediately)
    print("\nAttempting login (should success)...")
    res = requests.post(f"{BASE_URL}/login", json={"username": username, "password": password})
    if res.status_code == 200:
        print("SUCCESS: Login successful.")
    else:
        print(f"FAILED: Login failed: {res.text}")
        sys.exit(1)

    # 3. Duplicate Email (Should fail)
    print("\nAttempting duplicate email registration...")
    res = requests.post(f"{BASE_URL}/register", json={"username": f"user2_{ts}", "email": email, "password": password})
    if res.status_code == 400:
        print("SUCCESS: Duplicate email rejected.")
    else:
        print(f"FAILED: Expected 400, got {res.status_code}")
        sys.exit(1)

    print("\nVerification Passed!")

if __name__ == "__main__":
    main()
