from mangum import Mangum
from blog_server import app

handler = Mangum(app)
