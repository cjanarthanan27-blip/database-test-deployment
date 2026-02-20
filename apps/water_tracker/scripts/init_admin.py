from app import app, db, User
from werkzeug.security import generate_password_hash

app.app_context().push()

# Check if admin user exists
admin = User.query.filter_by(username='admin').first()

if not admin:
    admin = User(
        username='admin',
        password_hash=generate_password_hash('password'),
        role='Admin'
    )
    db.session.add(admin)
    db.session.commit()
    print('Admin user created successfully!')
else:
    print('Admin user already exists')
