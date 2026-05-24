import logging
from dotenv import load_dotenv
load_dotenv()  # must run before any service reads os.environ

from app import create_app
from app.services.data_cache import init_cache
from app.services.synthetic_ratings import generate_synthetic_ratings
from app.services.collab_filter import collab_filter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

app = create_app()

if __name__ == "__main__":
    init_cache()
    ratings_df = generate_synthetic_ratings()
    collab_filter.fit(ratings_df)
    app.run(port=8000, debug=True, use_reloader=False)
