from app.security.utils.hash import hash_password

password = "admin123"
hashed = hash_password(password)

print("\nHASH GENERADO:\n")
print(hashed)