<?php

namespace App;

class Router
{
    private array $routes = [];

    public function get(string $path, array $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, array $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, array $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, array $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    public function dispatch(string $method, string $uri): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->match($route['path'], $uri);
            if ($params !== false) {
                [$class, $action] = $route['handler'];
                (new $class())->$action($params);
                return;
            }
        }

        json(['erro' => 'Rota não encontrada'], 404);
    }

    private function add(string $method, string $path, array $handler): void
    {
        $this->routes[] = ['method' => $method, 'path' => $path, 'handler' => $handler];
    }

    private function match(string $routePath, string $uri): array|false
    {
        preg_match_all('/\{(\w+)\}/', $routePath, $paramNames);

        $pattern = preg_replace('/\{(\w+)\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (!preg_match($pattern, $uri, $matches)) {
            return false;
        }

        array_shift($matches);

        return array_combine($paramNames[1], $matches) ?: [];
    }
}
