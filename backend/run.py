import logging
from app import create_app
from app.services.data_cache import init_cache

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

app = create_app()

if __name__ == "__main__":
    init_cache()
    app.run(port=8000, debug=True, use_reloader=False)
