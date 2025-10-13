#!/bin/bash

# ---------------------------------------------------------------------
# exports ...

# ---------------------------------------------------------------------
# dev

# ---------------------------------------------------------------------
# subs-fast acc

alias _source_aliases="source $HOME/.bash_aliases"
alias _edit_aliases="nano $HOME/.bash_aliases"
alias _history="cat $HOME/.bash_history | grep $*"

# ---------------------------------------------------------------------
function _ip_loc(){

  if [ "$1" == "" ]; then
    echo "Usage: _ip_loc <eth[x]>"
    return
  fi

  device=$1
  /sbin/ifconfig "$device" | grep "inet addr" | awk -F: '{print $2}' | awk '{print $1}'
  /sbin/ifconfig "$device" | grep "inet " | sed s/"inet addr:"//i | sed s/"          "//i
}


function _ip_inet(){

  # https://api.ipify.org > raw ip:txt
  wget -qO- http://ipecho.net/plain
  # https://ipinfo.io/json
  # {
  #   "ip": "141.135.200.102",
  #   "hostname": "d8D87C866.access.telenet.be",
  #   "city": "Kruishoutem",
  #   "region": "Flanders",
  #   "country": "BE",
  #   "loc": "50.9000,3.5167",
  #   "postal": "9770",
  #   "org": "AS6848 Telenet BVBA"
  # }
  echo ""

}

_mkcd () { 
  mkdir $1 && cd $1
}

# ---------------------------------------------------------------------

alias _c="clear"
alias _update="sudo apt-get update "
alias _upgrade="sudo apt-get upgrade "
alias _install="sudo apt-get install "
alias _remove="sudo apt-get remove "
alias _cache_search="apt-cache search "
alias _policy="apt-cache policy "
alias _dpkg_search="dpkg --get-selections | grep -v deinstall | grep "
alias _l="ls -lah"

export LS_OPTIONS=" --color=auto"

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
  test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
  alias grep='grep $LS_OPTIONS'
  alias fgrep='fgrep $LS_OPTIONS'
  alias egrep='egrep $LS_OPTIONS'
  alias ls='ls $LS_OPTIONS'
  alias _l='ls -lah $LS_OPTIONS'
fi

# ---------------------------------------------------------------------

# root
# PS1='${debian_chroot:+($debian_chroot)}\[\033[01;31m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\$ '

# rem-user
PS1='${debian_chroot:+($debian_chroot)}\[\033[01;33m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\$ '

# normal
# PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\$ '
