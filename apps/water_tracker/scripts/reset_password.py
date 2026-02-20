from app import app, db, User
from werkzeug.security import generate_password_hash

with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print(f"Found admin user.")
        admin.password_hash = generate_password_hash('admin123')
        db.session.commit()
        print("Admin password has been reset to: admin123")
    else:
        print("Admin user not found. Creating new admin user.")
        admin = User(
            username='admin',
            password_hash=generate_password_hash('admin123'),
            role='Admin',
            is_active=True
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created with password: admin123")
