#!/bin/bash
RAWQUERY=$(<query.txt)
QUERY=${RAWQUERY//$'\n'/\\\\n}
DATARAW='{"query":"'$QUERY'"}'
echo $DATARAW

eval "curl 'https://ceremony-api.withjoy.com/graphql' -H 'content-type: application/json' --data-raw \$'"$DATARAW"'"