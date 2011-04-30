exports.get_batch = function( application, assert ) {
  var DbCriteria = require( 'db/db_criteria' );

  return {
    topic : application,
    'clone' : function(){
      var criteria1 = new DbCriteria;
      var criteria2 = criteria1.clone();

      [
        'select',
        'distinct',
        'condition',
        'params',
        'limit',
        'offset',
        'order',
        'group',
        'join',
        'having',
        'alias'
      ].forEach( function( par ) {
        assert.equal( criteria1[ par ], criteria2[ par ] );
      } );

      criteria1.select = 'a';
      assert.equal( criteria2.select, '*' );
    },

    'merge with' : {

      'merging select' : {
        'should be replaced' : function(){
          var criteria1 = new DbCriteria;
          criteria1.select = '*';

          var criteria2 = new DbCriteria;
          criteria2.select = 'a';

          criteria1.merge_with( criteria2 );

          assert.equal( criteria1.select, 'a' );
        },
        
        'equal selects should be left as is' : function(){
          var criteria1 = new DbCriteria;
          criteria1.select = 'a';
      
          var criteria2 = new DbCriteria;
          criteria2.select = 'a';
      
          criteria1.merge_with( criteria2 );
      
          assert.equal( criteria1.select, 'a' );
        },
        
        'not equal selects are being merged' : function(){
          var criteria1 = new DbCriteria;
          criteria1.select = 'a, b, c, d';
      
          var criteria2 = new DbCriteria;
          criteria2.select = 'a, c, e, f';
      
          criteria1.merge_with( criteria2 );
      
          assert.deepEqual( criteria1.select, [ 'a', 'b', 'c', 'd', 'e', 'f' ] );
        }
      },
      'conditions' : {
        'equal conditions are not merged' : function(){
          var criteria1 = new DbCriteria;
          criteria1.condition = 'a';
      
          var criteria2 = new DbCriteria;
          criteria2.condition = 'a';
      
          criteria1.merge_with(criteria2);
      
          assert.equal( criteria1.condition, 'a' );
        },

        'empty condition is being replaced' : function(){
          var criteria1 = new DbCriteria;
          criteria1.condition = '';

          var criteria2 = new DbCriteria;
          criteria2.condition = 'a';

          criteria1.merge_with(criteria2);

          assert.equal(criteria1.condition, 'a');
        },

        'not empty conditions are merged' : function(){
          var criteria1 = new DbCriteria;
          criteria1.condition = 'a';

          var criteria2 = new DbCriteria;
          criteria2.condition = 'b';

          criteria1.merge_with(criteria2);

          assert.equal(criteria1.condition, '(a) AND (b)');
        }
      },

      'limit, offset, distinct and alias are being replaced' : function() {
        var criteria1 = new DbCriteria;
        criteria1.limit = 10;
        criteria1.offset = 5;
        criteria1.alias = 'alias1';
        criteria1.distinct = true;

        var criteria2 = new DbCriteria;
        criteria2.limit = 20;
        criteria2.offset = 6;
        criteria2.alias = 'alias2';
        criteria1.distinct = false;

        criteria1.merge_with(criteria2);

        assert.equal(criteria1.limit, 20);
        assert.equal(criteria1.offset, 6);
        assert.equal(criteria1.alias, 'alias2');
        assert.equal(criteria1.distinct, false);
      },

      'empty order, group, join, having are being replaced' : function(){
        var criteria1 = new DbCriteria;
        criteria1.order = '';
        criteria1.group = '';
        criteria1.join = '';
        criteria1.having = '';

        var criteria2 = new DbCriteria;
        criteria2.order = 'a';
        criteria1.group = 'a';
        criteria1.join = 'a';
        criteria2.having = 'a';

        criteria1.merge_with(criteria2);

        assert.equal(criteria1.order, 'a');
        assert.equal(criteria1.group, 'a');
        assert.equal(criteria1.join, 'a');
        assert.equal(criteria1.having, 'a');
      },

      'merging with empty order, group, join ignored' : function(){
        var criteria1 = new DbCriteria;
        criteria1.order = 'a';
        criteria1.group = 'a';
        criteria1.join = 'a';
        criteria1.having = 'a';

        var criteria2 = new DbCriteria;
        criteria2.order = '';
        criteria2.group = '';
        criteria2.join = '';
        criteria2.having = '';

        criteria1.merge_with(criteria2);

        assert.equal(criteria1.order, 'a');
        assert.equal(criteria1.group, 'a');
        assert.equal(criteria1.join, 'a');
        assert.equal(criteria1.having, 'a');
      },

      'not empty order, group, join are being merged' : function(){
        var criteria1 = new DbCriteria;
        criteria1.order = 'a';
        criteria1.group = 'a';
        criteria1.join = 'a';
        criteria1.having = 'a';

        var criteria2 = new DbCriteria;
        criteria2.order = 'b';
        criteria2.group = 'b';
        criteria2.join = 'b';
        criteria2.having = 'b';

        criteria1.merge_with(criteria2);

        assert.equal(criteria1.order, 'b, a');
        assert.equal(criteria1.group, 'a, b');
        assert.equal(criteria1.join, 'a b');
        assert.equal(criteria1.having, '(a) AND (b)');
      },

      'merging two criteria with parameters' : function(){
        var criteria1 = new DbCriteria({
          condition : 'a=:param1 and b=:param2',
          params    : {
            'param1' : 1,
            'param2' : 2
          }
        });

        var criteria2 = new DbCriteria({
          condition : 'c=:param3 and d=:param4',
          params    : {
            'param3' : 3,
            'param4' : 4
          }
        });

        criteria1.merge_with(criteria2);

        assert.equal(criteria1.condition, '(a=:param1 and b=:param2) AND (c=:param3 and d=:param4)');
        assert.equal(criteria1.params['param1'], 1);
        assert.equal(criteria1.params['param2'], 2);
        assert.equal(criteria1.params['param3'], 3);
        assert.equal(criteria1.params['param4'], 4);
      }
    }
  }
}