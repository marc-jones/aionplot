db = db.getSiblingDB('time_series');
db.test.insert({'test': 'test'});
db.createUser({
  user: 'webapp',
  pwd: '{{ mongo_webapp_password }}',
  roles: ['read']
});
db.createUser({
  user: 'dbadmin',
  pwd: '{{ mongo_dbadmin_password }}',
  roles: ['readWrite', 'dbAdmin']
});
