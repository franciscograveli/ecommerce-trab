<?php

namespace App;

use App\Middleware\Auth;

class Router
{
    private array $routes = [];

    // $roles = null  → rota pública (sem autenticação)
    // $roles = []    → qualquer usuário autenticado
    // $roles = ['admin', 'representante'] → perfis permitidos

    public function get(string $path, array $handler, ?array $roles = null): void
    {
        $this->add('GET', $path, $handler, $roles);
    }

    public function post(string $path, array $handler, ?array $roles = null): void
    {
        $this->add('POST', $path, $handler, $roles);
    }

    public function put(string $path, array $handler, ?array $roles = null): void
    {
        $this->add('PUT', $path, $handler, $roles);
    }

    public function delete(string $path, array $handler, ?array $roles = null): void
    {
        $this->add('DELETE', $path, $handler, $roles);
    }

    public function dispatch(string $method, string $uri): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->match($route['path'], $uri);
            if ($params === false) {
                continue;
            }

            $this->authorize($route['roles']);

            [$class, $action] = $route['handler'];
            (new $class())->$action($params);
            return;
        }

        json(['erro' => 'Rota não encontrada'], 404);
    }

    private function add(string $method, string $path, array $handler, ?array $roles): void
    {
        $this->routes[] = [
            'method'  => $method,
            'path'    => $path,
            'handler' => $handler,
            'roles'   => $roles,
        ];
    }

    private function authorize(?array $roles): void
    {
        if ($roles === null) {
            return; // rota pública
        }

        if (empty($roles)) {
            Auth::handle(); // qualquer autenticado
            return;
        }

        Auth::require(...$roles);
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
