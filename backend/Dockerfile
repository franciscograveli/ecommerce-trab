FROM php:8.1-apache

# Dependências do sistema
RUN apt-get update && apt-get install -y git unzip && rm -rf /var/lib/apt/lists/*

# Extensões PHP necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Habilita mod_rewrite para o roteamento via .htaccess
RUN a2enmod rewrite

# Aponta o DocumentRoot para public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/sites-available/default-ssl.conf

# Permite que o .htaccess funcione
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Instala o Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --optimize-autoloader
