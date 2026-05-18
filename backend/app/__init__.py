from flask import Flask, request, jsonify
from .routes.movies import movies_bp
from .routes.recommendations import recs_bp


def create_app():
    app = Flask(__name__)

    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            res = jsonify({})
            res.headers["Access-Control-Allow-Origin"] = "*"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            return res, 200

    app.register_blueprint(movies_bp, url_prefix="/api/movies")
    app.register_blueprint(recs_bp,   url_prefix="/api/recommendations")

    return app
