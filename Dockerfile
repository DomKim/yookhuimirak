FROM php:8.2-apache

# 시스템 패키지
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libfreetype6-dev libzip-dev libonig-dev \
    default-mysql-client curl unzip git \
    && rm -rf /var/lib/apt/lists/*

# PHP 확장
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd mysqli pdo_mysql zip mbstring

# Apache mod_rewrite
RUN a2enmod rewrite

# PHP 설정
RUN echo "upload_max_filesize=50M" > /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "date.timezone=Asia/Seoul" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "short_open_tag=On" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "display_errors=On" >> /usr/local/etc/php/conf.d/custom.ini

# DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# AllowOverride All (.htaccess)
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

WORKDIR /var/www/html

EXPOSE 80
