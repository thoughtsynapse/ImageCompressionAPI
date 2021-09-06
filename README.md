### Image Compression API

:exclamation: Image Compressor API compresses JPG, PNG, GIF & SVG images.   
:exclamation: The compression type by default is lossy. You can choose loseless compression as per your needs.      
:exclamation: You can also choose the quality of compression you would like. By default Quality is set to 85% for JPG and 65-85% for PNG.   
:exclamation: By default metadata is stripped from the images, you can choose to retain image metadata.    
:exclamation: The API returns the URL of orignal and compressed image in a JSON object along with bunch of other data.      
:exclamation: Documentation for installing Compressor API on DigitalOcean Ubuntu 20.04 Droplet is explained below.   
:exclamation: Before proceeding to that, please create a DigitalOcean Ubuntu 20.04 Droplet and point your domain's A Reocrd to the Droplet's IP.    
   
<ins> ### How to use </ins>  
![alt text](https://github.com/twoabd/Image-Compression-API/blob/main/docs/lossy.png?raw=true)  
:exclamation: Learn to use Postman, it will save a lot of your time. 
![alt text](https://github.com/twoabd/Image-Compression-API/blob/main/docs/Lossless.png?raw=true)   

#### Install Nginx (Currently v1.18.0) and NodeJs LTS (Currently v14.17.6) on Ubuntu 20.04
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
sudo apt install jpegoptim
sudo apt install pngquant -y
sudo apt install optipng
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
sudo mkdir -p /var/www/sixsilicon.com/api/input
sudo mkdir -p /var/www/sixsilicon.com/api/output
sudo chown -R www-data:www-data /var/www/sixsilicon.com
sudo chmod -R 755 /var/www/sixsilicon.com
```

#### Creating Virtual Host
```
sudo nano /etc/nginx/sites-available/sixsilicon.com
server {
    listen 80;
    server_name sixsilicon.com;

    #  Web Root
    root /var/www/sixsilicon.com/api;
   
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
    
    # Input Folder
    location ^~ "/input/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/.(jpg|jpeg|png|gif|svg)$" {
        try_files $uri $uri/ =404;
    }

	# Output Folder
    location ^~ "/output/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/.(jpg|jpeg|png|gif|svg)$" {
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

#### Install Formidable, UUID, find-remove and PM2
```
npm install express --save
npm install validator
npm install formidable
npm install uuid
npm install -S find-remove
npm install pm2 -g
pm2 startup
```

#### Run Api Server
```
sudo systemctl restart nginx
cd /var/www/sixsilicon/api
pm2 start app.js -i max
```
