# Local RSA JWT keys

The application uses RS256: the private key signs tokens and the public key verifies them.

Generate an RSA 3072-bit key pair locally (OpenSSL):

```powershell
New-Item -ItemType Directory -Force .\secrets | Out-Null
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out .\secrets\jwt-private.pem
openssl pkey -in .\secrets\jwt-private.pem -pubout -out .\secrets\jwt-public.pem
```

Run these commands from the `backend/bus-tracker` directory. The private key is PKCS#8 PEM and the public key is X.509 SubjectPublicKeyInfo PEM.

Default paths (already ignored by Git):
- `secrets/jwt-private.pem`
- `secrets/jwt-public.pem`

You can override paths with `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH`. Never put either key under `src/main/resources`, never commit them, and never share the private key. Back up the private key securely; tokens signed by a different private key will no longer validate against the old public key.

JWT access tokens use RS256 and carry `sub`, `jti`, `tokenType=ACCESS`, `iat`, `exp`, and authorities. Refresh tokens use `tokenType=REFRESH` and must not be sent to protected APIs. Persistent refresh-token rotation/revocation and login issuance belong to the Identity module and are not implemented by this cryptographic adapter alone.
