var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var DbCriteriaSelectedTables = require('autodafe/framework/db/db_criteria_selected_tables');

vows.describe( 'db select statement' ).addBatch({
  'Create select statement' : {
    topic : function(){
      return new DbCriteriaSelectedTables( 'table1', 'table2' );
    },

    '.get_tables()' : function( st ){
      assert.deepEqual( st.get_tables(), ['table1', 'table2'] );
    },

    '.add_tables()' : function( st ){
      st.add_tables( 'table1', 'table3' );
      assert.deepEqual( st.get_tables(), ['table1', 'table2', 'table3'] );
    },

    '.remove_tables()' : function( st ){
      st.remove_tables( 'table2' );
      assert.deepEqual( st.get_tables(), ['table1', 'table3'] );
    },
    
    '.merge_with()' : function( st ){
      var new_st    = new DbCriteriaSelectedTables( 'table2', 'table3', 'table4' );
      st.merge_with( new_st );
      assert.deepEqual( new_st.get_tables(),    ['table2', 'table3', 'table4'] );
      assert.deepEqual( st.get_tables().sort(), ['table1', 'table2', 'table3', 'table4'] );
    }
  },

  'Create select statement by array' : {
    topic : function(){
      return new DbCriteriaSelectedTables( ['table1', 'table2'] );
    },

    '.get_tables()' : function( st ){
      assert.deepEqual( st.get_tables(), ['table1', 'table2'] );
    },

    '.add_tables()' : function( st ){
      st.add_tables( ['table1', 'table3'] );
      assert.deepEqual( st.get_tables(), ['table1', 'table2', 'table3'] );
    },

    '.remove_tables()' : function( st ){
      st.remove_tables( ['table2'] );
      assert.deepEqual( st.get_tables(), ['table1', 'table3'] );
    },

    '.merge_with()' : function( st ){
      st.merge_with( 'table2', 'table3', 'table4' );
      assert.deepEqual( st.get_tables().sort(),  ['table1', 'table2', 'table3', 'table4'] );
    }
  },

  'select with spaces' : {
    topic : function(){
      return new DbCriteriaSelectedTables( 'table as alias' );
    },

    'should save spaces' : function( st ){
      assert.equal( st.toString(), 'table as alias' );
    }
  }
}).export( module );



