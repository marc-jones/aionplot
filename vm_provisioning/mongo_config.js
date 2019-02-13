db = db.getSiblingDB('time_series');
db.test.insert({'test': 'test'});
db.createUser({
  user: '{{ MONGO_WEBAPP_USERNAME }}',
  pwd: '{{ MONGO_WEBAPP_PASSWORD }}',
  roles: ['read']
});
db.createUser({
  user: '{{ MONGO_DBADMIN_USERNAME }}',
  pwd: '{{ MONGO_DBADMIN_PASSWORD }}',
  roles: ['readWrite', 'dbAdmin']
});
