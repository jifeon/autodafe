module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'CMApp',

  preload_components : [ 'log_router' ],

  components      : {
    web_sockets         : false,
    users               : {
      model : 'test_model',
      roles : {
        user      : 'user.id != null',
        moderator : 'user.status == "moderator"',
        admin     : function( user, app ) {
          return ~app.get_param( 'admin_ids' ).indexOf( user.id );
        }
      },
      // По умолчанию ниодна роль не имеет права ни на что.
      // Здесь указываются глобальные параметры ДЛЯ ВСЕГО, которые могут перезаданы для каждой отдельной модели,
      // которые в свою очередь могут быть перекрыты настройками для ее аттрибутов.
      possibilities : {
        guest     : [],
        user      : [],
        moderator : [ 'view' ],
        admin     : [ 'view', 'create', 'edit', 'remove' ]
      }
    },

    log_router          : {
      routes : {
        console : {
          levels : [ 'warning', 'error', 'info', 'trace' ]
        }
      }
    },

    // user's components
    user_component : {
      param : 42
    },

    nested_user_component : {
      param : 43
    }
  }
}