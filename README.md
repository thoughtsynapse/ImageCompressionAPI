## Image Compression API

```
Image Compressor API compresses JPG, PNG, GIF & SVG images.        
Documentation for installing Compressor API on DigitalOcean Ubuntu 20.04 Droplet is explained below.   
Before proceeding to that, please create a DigitalOcean Ubuntu 20.04 Droplet.   
Also point your domain's A Reocrd to the Droplet's IP.    
```

## How to use   

#### POST Request, No GET
```
It receives all parameters in a POST request.     
You can choose one image at a time.
Send image with 'inImg' key through POST request.
```

#### Compression Type
```
By Default image compression type is lossy.   
You can choose lossless compression with 'isLossy' key and value 'false' through POST request.
```

#### Compression Quality
```
Default JPG Image Compression Quality = 85.  
You can choose between 1-100 with 'imgQuality' key and value 'YOURVALUE' through POST request. 

Default PNG Image Compression Quality = 85.   
You can choose between 1-100 with 'imgQuality' key and value 'YOURVALUE' through POST request.  

Default SVG Image Compression Quality = 85.   
You can choose between 1-100 with 'imgQuality' key and value 'YOURVALUE' through POST request.

Default GIF Image Compression Quality = 5.   
You can choose between 1-10 with 'imgQuality' key and value 'YOURVALUE' through POST request.

For GIF, do not choose any value lower than 5, quality loss will be significant.
```

#### Strip Meta
```
By Default image metadata will be stripped.   
You can choose not to strip meta with stripMeta
```

![alt text](https://github.com/twoabd/Image-Compression-API/blob/main/docs/lossy.png?raw=true)  
 
![alt text](https://github.com/twoabd/Image-Compression-API/blob/main/docs/Lossless.png?raw=true)  

## Installation Documentation (Ubuntu 20.04 LTS)   

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
sudo mkdir -p /var/www/api.sixsilicon.com
sudo mkdir -p /var/www/api.sixsilicon.com/input
sudo mkdir -p /var/www/api.sixsilicon.com/output
sudo chown -R www-data:www-data /var/www/api.sixsilicon.com
sudo chmod -R 755 /var/www/api.sixsilicon.com
```

#### Creating Virtual Host
```
sudo nano /etc/nginx/sites-available/api.sixsilicon.com
server {
    listen 80;
    server_name api.sixsilicon.com;

    #  Web Root
    root /var/www/api.sixsilicon.com;
   
    # API Folder
    location ^~ /compress {
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
sudo ln -s /etc/nginx/sites-available/api.sixsilicon.com /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

#### Installing SSL
```
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.sixsilicon.com
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

#### Copy Repo Files to /var/www/api.sixsilicon.com & Install Dependencies
```
cd /var/www/api.sixsilicon.com
npm install
npm install pm2 -g
pm2 startup
```

#### Run Api Server
```
cd /var/www/api.sixsilicon.com
pm2 start prod.json -i max
```
