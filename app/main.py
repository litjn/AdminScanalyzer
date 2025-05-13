from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import log_routes, model_routes
from app.api.stream_routes import stream_router

#from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Scanalyzer API")


origins = [
    "http://localhost:5173",
    "*"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(log_routes.router)
app.include_router(stream_router)
app.include_router(model_routes.router)
@app.get("/")
async def root():
    return {"message": "FastAPI server running!"}


#app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")