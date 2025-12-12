import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5001/api"

def main():
    print("Verifying Mobile Notifications...")
    
    ts = int(time.time())
    userA = f"sender_{ts}"
    userB = f"receiver_{ts}"
    password = "password"
    
    # 1. Register User A and User B
    print(f"\nRegistering {userA} and {userB}...")
    requests.post(f"{BASE_URL}/register", json={"username": userA, "email": f"{userA}@test.com", "password": password})
    resB = requests.post(f"{BASE_URL}/register", json={"username": userB, "email": f"{userB}@test.com", "password": password})
    
    # Login to get IDs and Tokens
    tokenA = requests.post(f"{BASE_URL}/login", json={"username": userA, "password": password}).json()['access_token']
    loginB = requests.post(f"{BASE_URL}/login", json={"username": userB, "password": password}).json()
    tokenB = loginB['access_token']
    idB = loginB['user_id']

    # 2. User A sends invite to User B
    print(f"\n{userA} sending invite to {userB} (ID: {idB})...")
    headersA = {"Authorization": f"Bearer {tokenA}"}
    res = requests.post(f"{BASE_URL}/invite", json={"receiver_id": idB, "location": "MA cigarette"}, headers=headersA)
    if res.status_code == 201:
        print("SUCCESS: Invite sent.")
    else:
        print(f"FAILED: Invite failed: {res.text}")
        sys.exit(1)

    # 3. User B fetches notifications
    print(f"\n{userB} checking notifications...")
    headersB = {"Authorization": f"Bearer {tokenB}"}
    res = requests.get(f"{BASE_URL}/notifications", headers=headersB)
    notifs = res.json()
    
    if len(notifs) > 0 and notifs[0]['sender_username'] == userA:
        print(f"SUCCESS: Notification received: {notifs[0]}")
    else:
        print(f"FAILED: Notification not found. Got: {notifs}")
        sys.exit(1)

    print("\nVerification Passed!")

if __name__ == "__main__":
    main()
