from app import app, db, User
from werkzeug.security import generate_password_hash

app.app_context().push()

# Find admin user and update password
admin = User.query.filter_by(username='admin').first()

if admin:
    admin.password_hash = generate_password_hash('password')
    db.session.commit()
    print('Admin password updated successfully!')
else:
    # Create new admin
    admin = User(
        username='admin',
        password_hash=generate_password_hash('password'),
        role='Admin'
    )
    db.session.add(admin)
    db.session.commit()
    print('Admin user created successfully!')
