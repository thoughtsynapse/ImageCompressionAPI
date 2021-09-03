### Image Compressor

#### Install Nginx, NodeJs LTS (Currently v14.17.6), Express on Ubuntu 20.04

```
sudo apt update
sudo apt install nginx

curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
cat /etc/apt/sources.list.d/nodesource.list
sudo apt  install nodejs
node  -v

npm install express
```

#### Install PNGQuant, JPEGOptim, OptiPNG, Gifsicle, Scour

```
sudo apt install PNGQuant
sudo apt install JPEGOptim
sudo apt install OptiPNG
sudo apt install Gifsicle
sudo apt install Scour
```

#### Updating Nginx conf in etc/nginx/nginx.conf
```
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
	worker_connections 768;
	multi_accept on;
}

http {

	# Basic Settings
	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
        client_max_body_size 20M;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;


	# SSL Settings
	ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
	ssl_prefer_server_ciphers on;


	# Logging Settings
	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;


	# Gzip Settings
	gzip on; 
	gzip_disable "msie6";
	gzip_vary on;
	gzip_proxied any;
	gzip_comp_level 6;
	gzip_buffers 16 8k;
	gzip_http_version 1.1;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;


	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;
}
```

#### Creating API Directory with Necessary Permission

```
sudo mkdir -p /var/www/sixsilicon.com/api
sudo chown -R www-data:www-data /var/www/sixsilicon.com/api
sudo chmod -R 755 /var/www/sixsilicon.com/api
```

#### Creating Virtual Host
```
sudo nano /etc/nginx/sites-available/sixsilicon.com
server {
    listen 80;
    server_name sixsilicon.com;

    location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 600s;
    }

}
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default
```
