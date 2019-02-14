# Commands for provisioning the virtual machine to run web server in Docker

## Setting up a local development environment

```
vagrant up
```

## Configure the hosts

```
cp hosts-template hosts
```

The ``dev`` host has been configured to work with the Vagrant virtual machine.


## Ensure that the development VM is responsive

```
ansible -m ping -i hosts dev
```

## Configure input variables

```
cp vars-template.yml vars.yml
```

The default values are reasonable for a development server, but you may want to
change the passwords.


## Provision the virtual machines using Ansible

```
ansible-playbook -i hosts playbook.yml --limit dev
```
