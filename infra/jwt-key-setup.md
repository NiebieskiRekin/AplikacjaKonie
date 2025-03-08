ssh-keygen -t rsa-sha2-256 -b 4096 -m PEM -f private.key
ssh-keygen -f private.key -e -m PKCS8 > public.key