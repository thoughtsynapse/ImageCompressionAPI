### Image Compressor

#### Install Nginx and NodeJs LTS (Currently v14.17.6) on Ubuntu 20.04

```
sudo apt update
sudo apt install nginx -y

curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
cat /etc/apt/sources.list.d/nodesource.list
sudo apt  install nodejs -y
node  -v
```

#### Install PNGQuant, JPEGOptim, Gifsicle, Scour

```
sudo apt install pngquant -y
sudo apt install jpegoptim
sudo apt install gifsicle
sudo apt install scour -y
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
sudo mkdir -p /var/www/sixsilicon.com/input
sudo mkdir -p /var/www/sixsilicon.com/output
sudo chown -R www-data:www-data /var/www/sixsilicon.com
sudo chmod -R 755 /var/www/sixsilicon.com
```

#### Creating Virtual Host
```
sudo nano /etc/nginx/sites-available/sixsilicon.com
server {
    listen 80;
    server_name sixsilicon.com;
    
    # Root Web App Folder
    root /var/www/sixsilicon.com;
    
    # API Folder
    location ~ ^/api {
	    proxy_pass http://localhost:3000;
	    proxy_http_version 1.1;
	    proxy_set_header Upgrade $http_upgrade;
	    proxy_set_header Connection 'upgrade';
	    proxy_set_header Host $host;
	    proxy_cache_bypass $http_upgrade;
	    proxy_read_timeout 60s;
    }
    
    # Image Folder
    location ~ ^/output {
        try_files $uri $uri/ =404;
    }
}
sudo ln -s /etc/nginx/sites-available/sixsilicon.com /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default
```

#### Installing SSL
```
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d sixsilicon.com
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

#### Create app.js in /var/www/sixsilicon.com/
```
cd /var/www/sixsilicon.com/api
nano app.js (https://raw.githubusercontent.com/twoabd/Compressor/main/api/app.js)
npm init -y
```

#### Giving Necessary Permission Again

```
sudo chown -R www-data:www-data /var/www/sixsilicon.com
sudo chmod -R 755 /var/www/sixsilicon.com
```

#### Install Formidable, UUID and PM2
```
npm install pm2 -g
pm2 startup
npm install formidable
npm install uuid
```

#### Run Api Server
```
sudo systemctl restart nginx
cd /var/www/sixsilicon/api
pm2 start app.js
```
