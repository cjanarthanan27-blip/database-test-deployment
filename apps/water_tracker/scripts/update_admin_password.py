from werkzeug.security import generate_password_hash
from app import app, db, User

def update_password():
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        if admin:
            # Generate a valid hash for 'admin123'
            hashed_pw = generate_password_hash('admin123')
            admin.password_hash = hashed_pw
            db.session.commit()
            print(f"Updated admin password hash: {hashed_pw}")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    update_password()
