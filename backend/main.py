# This file is deprecated. Use app.main instead.
from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=1821, reload=True) 