#!/bin/bash
RAWQUERY=$(<query.txt)
VARIABLES=$(<variables.txt)
HEADERS=$(<headers.txt)
QUERY=${RAWQUERY//$'\n'/\\\\n}
DATARAW='{"query":"'$QUERY'","variables":'$VARIABLES'}'

REQUEST="curl 'https://ceremony-api.withjoy.com/graphql' -H 'content-type: application/json' "$HEADERS" --data-raw \$'"$DATARAW"'"
echo $REQUEST
eval $REQUEST