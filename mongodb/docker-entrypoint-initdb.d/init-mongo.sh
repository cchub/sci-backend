mongo -- "$MONGO_INITDB_DATABASE" <<EOF
    var rootUser = "$MONGO_INITDB_ROOT_USERNAME";
    var rootPassword = "$MONGO_INITDB_ROOT_PASSWORD";
    var admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);

    var user = "$MONGO_INITDB_USERNAME";
    var pwd = "$MONGO_INITDB_PASSWORD";
    var dab = "$MONGO_INITDB_DATABASE";
    db.createUser({ user, pwd, roles: [{ role: "readWrite", db: dab }] });
EOF
