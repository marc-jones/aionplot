# Commands for provisioning the virtual machine to run web server in Docker

## Setting up a local development environment

```
vagrant up
```

## Finding out which VMs are responsive

```
ansible -m ping -i hosts all
```

## Configure input variables

```
cp vars-template.yml vars.yml
```

Update the ``vars.yml`` file with appropriate input variables.


## Provision the virtual machines using Ansible

```
ansible-playbook -i hosts playbook.yml
```
