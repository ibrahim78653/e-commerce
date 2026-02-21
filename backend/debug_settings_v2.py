try:
    from config import settings
    print(f"Success! APP_NAME: {settings.APP_NAME}")
except Exception as e:
    print(f"Caught exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
