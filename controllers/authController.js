const authController = {
  loginForm: (req, res) => {
    if (req.session && req.session.user) {
      return res.redirect('/');
    }
    res.render('auth/login', { title: 'Iniciar Sesión' });
  },

  login: (req, res) => {
    const { username, password } = req.body;

    // Credenciales hardcodeadas
    if (username === 'duckmoron' && password === 'expensas2025') {
      req.session.user = { username };
      return res.redirect('/');
    }

    res.render('auth/login', { 
      title: 'Iniciar Sesión', 
      error: 'Usuario o contraseña incorrectos' 
    });
  },

  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/');
  }
};

module.exports = authController;