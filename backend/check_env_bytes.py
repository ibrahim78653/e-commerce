with open(".env", "rb") as f:
    content = f.read()
    print(f"Content length: {len(content)}")
    print(f"Representation: {content!r}")
