set -m
/entrypoint.sh couchbase-server &
sleep 10

couchbase-cli cluster-init -c localhost:8091 \
--cluster-username $CB_CLUSTER_USERNAME \
--cluster-password $CB_CLUSTER_PASSWORD \
--services $CB_CLUSTER_SERVICES \
--cluster-ramsize $CB_CLUSTER_RAMSIZE \
--cluster-index-ramsize $CB_CLUSTER_INDEX_RAMSIZE \
--cluster-fts-ramsize $CB_CLUSTER_FTS_RAMSIZE \
--cluster-eventing-ramsize $CB_CLUSTER_EVENTING_RAMSIZE \
--cluster-analytics-ramsize $CB_CLUSTER_ANALYTICS_RAMSIZE

couchbase-cli bucket-create \
  --username $CB_CLUSTER_USERNAME \
  --password $CB_CLUSTER_PASSWORD \
  --cluster 127.0.0.1:8091 \
  --bucket default \
  --bucket-type couchbase \
  --bucket-ramsize $CB_CLUSTER_BUCKET_DEFAULT_RAMSIZE

couchbase-cli collection-manage -c localhost:8091 -u $CB_CLUSTER_USERNAME -p $CB_CLUSTER_PASSWORD  --bucket default --create-collection _default.jobs
couchbase-cli collection-manage -c localhost:8091 -u $CB_CLUSTER_USERNAME -p $CB_CLUSTER_PASSWORD  --bucket default --create-collection _default.errorMessageVectors
couchbase-cli collection-manage -c localhost:8091 -u $CB_CLUSTER_USERNAME -p $CB_CLUSTER_PASSWORD  --bucket default --create-collection _default.errorCategoriesVectors

COUCHBASE_PID=$!
wait $COUCHBASE_PID
