
# Vendor Management APIs
@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        vendors = MasterSource.query.filter_by(source_type='Vendor').all()
        return jsonify([{
            "id": v.id,
            "source_name": v.source_name,
            "is_active": v.is_active
        } for v in vendors]), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/vendors', methods=['POST'])
def create_vendor():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        data = request.json
        new_vendor = MasterSource(
            source_name=data['source_name'],
            source_type='Vendor',
            is_active=data.get('is_active', True)
        )
        db.session.add(new_vendor)
        db.session.commit()
        return jsonify({"status": "success", "id": new_vendor.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/vendors/<int:vendor_id>', methods=['PUT'])
def update_vendor(vendor_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        vendor = MasterSource.query.get(vendor_id)
        if not vendor or vendor.source_type != 'Vendor':
            return jsonify({"status": "error", "message": "Vendor not found"}), 404
        
        data = request.json
        vendor.source_name = data.get('source_name', vendor.source_name)
        vendor.is_active = data.get('is_active', vendor.is_active)
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Vendor updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/vendors/<int:vendor_id>', methods=['DELETE'])
def delete_vendor(vendor_id):
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        vendor = MasterSource.query.get(vendor_id)
        if not vendor or vendor.source_type != 'Vendor':
            return jsonify({"status": "error", "message": "Vendor not found"}), 404
        
        db.session.delete(vendor)
        db.session.commit()
        return jsonify({"status": "success", "message": "Vendor deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

