#!/bin/bash

cd mongo_populator_image/

docker build -t aionplot-populator .
docker tag aionplot-populator dmarcjones/aionplot-populator:dev
docker push dmarcjones/aionplot-populator:dev

cd ../vm_provisioning/

for idx in {1..1}
do

    echo $idx
    \time ansible-playbook -i hosts populator-playbook.yml --limit dev

done

cd ..
