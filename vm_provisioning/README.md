# Commands for provisioning the virtual machine to run web server in Docker

## Setting up a local development environment

```
vagrant up
```

## Finding out which VMs are responsive

```
ansible -m ping -i hosts all
```


## Provision the virtual machines using Ansible

```
ansible-playbook -i hosts playbook.yml
```
