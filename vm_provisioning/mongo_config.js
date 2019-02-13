db = db.getSiblingDB('time_series');
db.test.insert({'test': 'test'});
db.createUser({
  user: '{{ mongo_webapp_username }}',
  pwd: '{{ mongo_webapp_password }}',
  roles: ['read']
});
db.createUser({
  user: '{{ mongo_dbadmin_username }}',
  pwd: '{{ mongo_dbadmin_password }}',
  roles: ['readWrite', 'dbAdmin']
});
