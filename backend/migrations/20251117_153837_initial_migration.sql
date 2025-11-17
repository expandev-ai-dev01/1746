/**
 * Database Migration
 * Generated: 2025-11-17T15:38:37.603Z
 * Timestamp: 20251117_153837
 *
 * This migration includes:
 * - Schema structures (tables, indexes, constraints)
 * - Initial data
 * - Stored procedures
 *
 * Note: This file is automatically executed by the migration runner
 * on application startup in Azure App Service.
 */

-- Set options for better SQL Server compatibility
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ANSI_WARNINGS ON;
SET NUMERIC_ROUNDABORT OFF;
GO

PRINT 'Starting database migration...';
PRINT 'Timestamp: 20251117_153837';
GO


-- ============================================
-- STRUCTURE
-- Database schemas, tables, indexes, and constraints
-- ============================================

-- File: functional/_structure.sql
/**
 * @schema functional
 * Business logic schema for StockBox application
 */
CREATE SCHEMA [functional];
GO

/**
 * @table product Product information
 * @multitenancy true
 * @softDelete true
 * @alias prd
 */
CREATE TABLE [functional].[product] (
  [idProduct] INTEGER IDENTITY(1, 1) NOT NULL,
  [idAccount] INTEGER NOT NULL,
  [name] NVARCHAR(100) NOT NULL,
  [description] NVARCHAR(500) NOT NULL DEFAULT (''),
  [dateCreated] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
  [dateModified] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
  [deleted] BIT NOT NULL DEFAULT (0)
);
GO

/**
 * @table movement Stock movement records
 * @multitenancy true
 * @softDelete false
 * @alias mov
 */
CREATE TABLE [functional].[movement] (
  [idMovement] INTEGER IDENTITY(1, 1) NOT NULL,
  [idAccount] INTEGER NOT NULL,
  [idProduct] INTEGER NULL,
  [idUser] INTEGER NOT NULL,
  [movementType] VARCHAR(50) NOT NULL,
  [quantity] NUMERIC(15, 2) NOT NULL,
  [dateTime] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
  [observation] NVARCHAR(500) NULL,
  [productName] NVARCHAR(100) NULL,
  [productDescription] NVARCHAR(500) NULL,
  [reason] NVARCHAR(200) NULL
);
GO

/**
 * @primaryKey pkProduct
 * @keyType Object
 */
ALTER TABLE [functional].[product]
ADD CONSTRAINT [pkProduct] PRIMARY KEY CLUSTERED ([idProduct]);
GO

/**
 * @primaryKey pkMovement
 * @keyType Object
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [pkMovement] PRIMARY KEY CLUSTERED ([idMovement]);
GO

/**
 * @foreignKey fkProduct_Account Account isolation for products
 * @target subscription.account
 * @tenancy true
 */
ALTER TABLE [functional].[product]
ADD CONSTRAINT [fkProduct_Account] FOREIGN KEY ([idAccount])
REFERENCES [subscription].[account]([idAccount]);
GO

/**
 * @foreignKey fkMovement_Account Account isolation for movements
 * @target subscription.account
 * @tenancy true
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [fkMovement_Account] FOREIGN KEY ([idAccount])
REFERENCES [subscription].[account]([idAccount]);
GO

/**
 * @foreignKey fkMovement_Product Product reference for movements
 * @target functional.product
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [fkMovement_Product] FOREIGN KEY ([idProduct])
REFERENCES [functional].[product]([idProduct]);
GO

/**
 * @foreignKey fkMovement_User User reference for movements
 * @target security.user
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [fkMovement_User] FOREIGN KEY ([idUser])
REFERENCES [security].[user]([idUser]);
GO

/**
 * @check chkMovement_MovementType Movement type validation
 * @enum {ENTRADA} Stock entry
 * @enum {SAIDA} Stock exit
 * @enum {ADICAO_PRODUTO} Product addition
 * @enum {ALTERACAO_QUANTIDADE} Quantity alteration
 * @enum {EXCLUSAO} Product deletion
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [chkMovement_MovementType] CHECK ([movementType] IN ('ENTRADA', 'SAIDA', 'ADICAO_PRODUTO', 'ALTERACAO_QUANTIDADE', 'EXCLUSAO'));
GO

/**
 * @check chkMovement_Quantity Quantity must be non-negative
 */
ALTER TABLE [functional].[movement]
ADD CONSTRAINT [chkMovement_Quantity] CHECK ([quantity] >= 0);
GO

/**
 * @index ixProduct_Account Account filtering for products
 * @type ForeignKey
 */
CREATE NONCLUSTERED INDEX [ixProduct_Account]
ON [functional].[product]([idAccount])
WHERE [deleted] = 0;
GO

/**
 * @index uqProduct_Account_Name Unique product name per account
 * @type Search
 * @unique true
 * @filter Active products only
 */
CREATE UNIQUE NONCLUSTERED INDEX [uqProduct_Account_Name]
ON [functional].[product]([idAccount], [name])
WHERE [deleted] = 0;
GO

/**
 * @index ixMovement_Account Account filtering for movements
 * @type ForeignKey
 */
CREATE NONCLUSTERED INDEX [ixMovement_Account]
ON [functional].[movement]([idAccount]);
GO

/**
 * @index ixMovement_Account_Product Product filtering for movements
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovement_Account_Product]
ON [functional].[movement]([idAccount], [idProduct])
INCLUDE ([movementType], [quantity], [dateTime]);
GO

/**
 * @index ixMovement_Account_DateTime Date filtering for movements
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovement_Account_DateTime]
ON [functional].[movement]([idAccount], [dateTime] DESC)
INCLUDE ([idProduct], [movementType], [quantity]);
GO

/**
 * @index ixMovement_Account_Type Type filtering for movements
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovement_Account_Type]
ON [functional].[movement]([idAccount], [movementType])
INCLUDE ([idProduct], [quantity], [dateTime]);
GO

/**
 * @index ixMovement_Account_User User filtering for movements
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovement_Account_User]
ON [functional].[movement]([idAccount], [idUser])
INCLUDE ([idProduct], [movementType], [quantity], [dateTime]);
GO


-- ============================================
-- STORED PROCEDURES
-- Database stored procedures and functions
-- ============================================

-- File: functional/movement/spMovementCreate.sql
/**
 * @summary
 * Creates a new stock movement record. Handles all movement types including
 * product addition, stock entry, stock exit, quantity alteration, and product deletion.
 * Validates business rules and updates product status accordingly.
 * 
 * @procedure spMovementCreate
 * @schema functional
 * @type stored-procedure
 * 
 * @endpoints
 * - POST /api/v1/internal/movement
 * 
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier for multi-tenancy
 * 
 * @param {INT} idUser
 *   - Required: Yes
 *   - Description: User performing the movement
 * 
 * @param {VARCHAR(50)} movementType
 *   - Required: Yes
 *   - Description: Type of movement (ENTRADA, SAIDA, ADICAO_PRODUTO, ALTERACAO_QUANTIDADE, EXCLUSAO)
 * 
 * @param {INT} idProduct
 *   - Required: No
 *   - Description: Product identifier (not required for ADICAO_PRODUTO)
 * 
 * @param {NUMERIC(15,2)} quantity
 *   - Required: Yes
 *   - Description: Quantity involved in the movement
 * 
 * @param {NVARCHAR(500)} observation
 *   - Required: No
 *   - Description: Additional observations
 * 
 * @param {NVARCHAR(100)} productName
 *   - Required: No
 *   - Description: Product name (required for ADICAO_PRODUTO)
 * 
 * @param {NVARCHAR(500)} productDescription
 *   - Required: No
 *   - Description: Product description (optional for ADICAO_PRODUTO)
 * 
 * @param {NVARCHAR(200)} reason
 *   - Required: No
 *   - Description: Reason for deletion (required for EXCLUSAO)
 * 
 * @returns {INT} idMovement - Created movement identifier
 * 
 * @testScenarios
 * - Valid ENTRADA movement increases stock
 * - Valid SAIDA movement decreases stock
 * - ADICAO_PRODUTO creates new product
 * - ALTERACAO_QUANTIDADE updates product quantity
 * - EXCLUSAO marks product as deleted
 * - Validation failures for insufficient stock
 * - Validation failures for duplicate product names
 * - Validation failures for missing required fields
 */
CREATE OR ALTER PROCEDURE [functional].[spMovementCreate]
  @idAccount INT,
  @idUser INT,
  @movementType VARCHAR(50),
  @idProduct INT = NULL,
  @quantity NUMERIC(15, 2),
  @observation NVARCHAR(500) = NULL,
  @productName NVARCHAR(100) = NULL,
  @productDescription NVARCHAR(500) = NULL,
  @reason NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @newIdProduct INT;
  DECLARE @currentQuantity NUMERIC(15, 2);

  /**
   * @validation Required parameter validation
   * @throw {parameterRequired}
   */
  IF @idAccount IS NULL
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  IF @idUser IS NULL
  BEGIN
    ;THROW 51000, 'idUserRequired', 1;
  END;

  IF @movementType IS NULL
  BEGIN
    ;THROW 51000, 'movementTypeRequired', 1;
  END;

  IF @quantity IS NULL
  BEGIN
    ;THROW 51000, 'quantityRequired', 1;
  END;

  /**
   * @validation Movement type validation
   * @throw {invalidMovementType}
   */
  IF @movementType NOT IN ('ENTRADA', 'SAIDA', 'ADICAO_PRODUTO', 'ALTERACAO_QUANTIDADE', 'EXCLUSAO')
  BEGIN
    ;THROW 51000, 'invalidMovementType', 1;
  END;

  /**
   * @validation Quantity validation for non-deletion movements
   * @throw {quantityMustBeGreaterThanZero}
   */
  IF @movementType IN ('ENTRADA', 'ADICAO_PRODUTO', 'ALTERACAO_QUANTIDADE') AND @quantity <= 0
  BEGIN
    ;THROW 51000, 'quantityMustBeGreaterThanZero', 1;
  END;

  /**
   * @validation Product name required for ADICAO_PRODUTO
   * @throw {productNameRequired}
   */
  IF @movementType = 'ADICAO_PRODUTO' AND (@productName IS NULL OR LEN(@productName) < 3)
  BEGIN
    ;THROW 51000, 'productNameRequired', 1;
  END;

  /**
   * @validation Product name length validation
   * @throw {productNameInvalid}
   */
  IF @productName IS NOT NULL AND (LEN(@productName) < 3 OR LEN(@productName) > 100)
  BEGIN
    ;THROW 51000, 'productNameInvalid', 1;
  END;

  /**
   * @validation Reason required for EXCLUSAO
   * @throw {reasonRequired}
   */
  IF @movementType = 'EXCLUSAO' AND @reason IS NULL
  BEGIN
    ;THROW 51000, 'reasonRequired', 1;
  END;

  /**
   * @validation Product ID required for non-ADICAO_PRODUTO movements
   * @throw {productIdRequired}
   */
  IF @movementType <> 'ADICAO_PRODUTO' AND @idProduct IS NULL
  BEGIN
    ;THROW 51000, 'productIdRequired', 1;
  END;

  BEGIN TRY
    /**
     * @rule {db-transaction-control} Transaction management for data integrity
     */
    BEGIN TRAN;

      /**
       * @rule {fn-product-addition} Handle product addition
       */
      IF @movementType = 'ADICAO_PRODUTO'
      BEGIN
        /**
         * @validation Check for duplicate product name
         * @throw {productNameAlreadyExists}
         */
        IF EXISTS (
          SELECT 1
          FROM [functional].[product] prd
          WHERE prd.[idAccount] = @idAccount
            AND prd.[name] = @productName
            AND prd.[deleted] = 0
        )
        BEGIN
          ;THROW 51000, 'productNameAlreadyExists', 1;
        END;

        INSERT INTO [functional].[product] (
          [idAccount],
          [name],
          [description],
          [dateCreated],
          [dateModified],
          [deleted]
        )
        VALUES (
          @idAccount,
          @productName,
          ISNULL(@productDescription, ''),
          GETUTCDATE(),
          GETUTCDATE(),
          0
        );

        SET @newIdProduct = SCOPE_IDENTITY();
        SET @idProduct = @newIdProduct;
      END
      ELSE
      BEGIN
        /**
         * @validation Product existence validation
         * @throw {productDoesntExist}
         */
        IF NOT EXISTS (
          SELECT 1
          FROM [functional].[product] prd
          WHERE prd.[idProduct] = @idProduct
            AND prd.[idAccount] = @idAccount
        )
        BEGIN
          ;THROW 51000, 'productDoesntExist', 1;
        END;

        /**
         * @rule {fn-stock-validation} Validate sufficient stock for SAIDA
         */
        IF @movementType = 'SAIDA'
        BEGIN
          SELECT @currentQuantity = ISNULL(SUM(
            CASE
              WHEN mov.[movementType] IN ('ENTRADA', 'ADICAO_PRODUTO') THEN mov.[quantity]
              WHEN mov.[movementType] = 'SAIDA' THEN -mov.[quantity]
              WHEN mov.[movementType] = 'ALTERACAO_QUANTIDADE' THEN 0
              ELSE 0
            END
          ), 0)
          FROM [functional].[movement] mov
          WHERE mov.[idAccount] = @idAccount
            AND mov.[idProduct] = @idProduct;

          IF @movementType = 'ALTERACAO_QUANTIDADE'
          BEGIN
            SET @currentQuantity = 0;
          END;

          /**
           * @validation Insufficient stock validation
           * @throw {insufficientStock}
           */
          IF @currentQuantity < @quantity
          BEGIN
            ;THROW 51000, 'insufficientStock', 1;
          END;
        END;

        /**
         * @rule {fn-product-deletion} Handle product deletion
         */
        IF @movementType = 'EXCLUSAO'
        BEGIN
          UPDATE [functional].[product]
          SET [deleted] = 1,
              [dateModified] = GETUTCDATE()
          WHERE [idProduct] = @idProduct
            AND [idAccount] = @idAccount;
        END;
      END;

      /**
       * @rule {fn-movement-registration} Register movement
       */
      INSERT INTO [functional].[movement] (
        [idAccount],
        [idProduct],
        [idUser],
        [movementType],
        [quantity],
        [dateTime],
        [observation],
        [productName],
        [productDescription],
        [reason]
      )
      VALUES (
        @idAccount,
        @idProduct,
        @idUser,
        @movementType,
        @quantity,
        GETUTCDATE(),
        @observation,
        @productName,
        @productDescription,
        @reason
      );

      DECLARE @idMovement INT = SCOPE_IDENTITY();

    COMMIT TRAN;

    /**
     * @output {MovementResult, 1, 1}
     * @column {INT} idMovement - Created movement identifier
     */
    SELECT @idMovement AS [idMovement];

  END TRY
  BEGIN CATCH
    ROLLBACK TRAN;
    THROW;
  END CATCH;
END;
GO

-- File: functional/movement/spMovementGet.sql
/**
 * @summary
 * Retrieves detailed information about a specific stock movement including
 * product details and user information.
 * 
 * @procedure spMovementGet
 * @schema functional
 * @type stored-procedure
 * 
 * @endpoints
 * - GET /api/v1/internal/movement/:id
 * 
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier for multi-tenancy
 * 
 * @param {INT} idMovement
 *   - Required: Yes
 *   - Description: Movement identifier
 * 
 * @testScenarios
 * - Retrieve existing movement successfully
 * - Validation failure for non-existent movement
 * - Validation failure for movement from different account
 */
CREATE OR ALTER PROCEDURE [functional].[spMovementGet]
  @idAccount INT,
  @idMovement INT
AS
BEGIN
  SET NOCOUNT ON;

  /**
   * @validation Required parameter validation
   * @throw {parameterRequired}
   */
  IF @idAccount IS NULL
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  IF @idMovement IS NULL
  BEGIN
    ;THROW 51000, 'idMovementRequired', 1;
  END;

  /**
   * @validation Movement existence validation
   * @throw {movementDoesntExist}
   */
  IF NOT EXISTS (
    SELECT 1
    FROM [functional].[movement] mov
    WHERE mov.[idMovement] = @idMovement
      AND mov.[idAccount] = @idAccount
  )
  BEGIN
    ;THROW 51000, 'movementDoesntExist', 1;
  END;

  /**
   * @output {MovementDetail, 1, n}
   * @column {INT} idMovement - Movement identifier
   * @column {INT} idProduct - Product identifier
   * @column {NVARCHAR} productName - Product name
   * @column {NVARCHAR} productDescription - Product description
   * @column {VARCHAR} movementType - Movement type
   * @column {NUMERIC} quantity - Movement quantity
   * @column {DATETIME2} dateTime - Movement date and time
   * @column {INT} idUser - User identifier
   * @column {NVARCHAR} userName - User name
   * @column {NVARCHAR} observation - Movement observation
   * @column {NVARCHAR} reason - Deletion reason
   */
  SELECT
    mov.[idMovement],
    mov.[idProduct],
    ISNULL(prd.[name], mov.[productName]) AS [productName],
    ISNULL(prd.[description], mov.[productDescription]) AS [productDescription],
    mov.[movementType],
    mov.[quantity],
    mov.[dateTime],
    mov.[idUser],
    usr.[name] AS [userName],
    mov.[observation],
    mov.[reason]
  FROM [functional].[movement] mov
    LEFT JOIN [functional].[product] prd ON (prd.[idAccount] = mov.[idAccount] AND prd.[idProduct] = mov.[idProduct])
    JOIN [security].[user] usr ON (usr.[idUser] = mov.[idUser])
  WHERE mov.[idMovement] = @idMovement
    AND mov.[idAccount] = @idAccount;
END;
GO

-- File: functional/movement/spMovementList.sql
/**
 * @summary
 * Retrieves a paginated list of stock movements with optional filtering by
 * date range, product, movement type, and user. Supports ordering and pagination.
 * 
 * @procedure spMovementList
 * @schema functional
 * @type stored-procedure
 * 
 * @endpoints
 * - GET /api/v1/internal/movement
 * 
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier for multi-tenancy
 * 
 * @param {DATE} dateStart
 *   - Required: No
 *   - Description: Start date for filtering
 * 
 * @param {DATE} dateEnd
 *   - Required: No
 *   - Description: End date for filtering
 * 
 * @param {INT} idProduct
 *   - Required: No
 *   - Description: Product identifier for filtering
 * 
 * @param {VARCHAR(50)} movementType
 *   - Required: No
 *   - Description: Movement type for filtering
 * 
 * @param {INT} idUser
 *   - Required: No
 *   - Description: User identifier for filtering
 * 
 * @param {VARCHAR(20)} orderBy
 *   - Required: No
 *   - Description: Ordering (DATA_HORA_ASC or DATA_HORA_DESC, default DESC)
 * 
 * @param {INT} pageSize
 *   - Required: No
 *   - Description: Number of records per page (default 50, max 100)
 * 
 * @param {INT} page
 *   - Required: No
 *   - Description: Page number (default 1)
 * 
 * @testScenarios
 * - List all movements without filters
 * - Filter by date range
 * - Filter by product
 * - Filter by movement type
 * - Filter by user
 * - Pagination works correctly
 * - Ordering works correctly
 */
CREATE OR ALTER PROCEDURE [functional].[spMovementList]
  @idAccount INT,
  @dateStart DATE = NULL,
  @dateEnd DATE = NULL,
  @idProduct INT = NULL,
  @movementType VARCHAR(50) = NULL,
  @idUser INT = NULL,
  @orderBy VARCHAR(20) = 'DATA_HORA_DESC',
  @pageSize INT = 50,
  @page INT = 1
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @offset INT;

  /**
   * @validation Required parameter validation
   * @throw {parameterRequired}
   */
  IF @idAccount IS NULL
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  /**
   * @validation Page size validation
   * @throw {invalidPageSize}
   */
  IF @pageSize < 1 OR @pageSize > 100
  BEGIN
    SET @pageSize = 50;
  END;

  /**
   * @validation Page number validation
   * @throw {invalidPage}
   */
  IF @page < 1
  BEGIN
    SET @page = 1;
  END;

  /**
   * @validation Date range validation
   * @throw {invalidDateRange}
   */
  IF @dateStart IS NOT NULL AND @dateEnd IS NOT NULL AND @dateStart > @dateEnd
  BEGIN
    ;THROW 51000, 'invalidDateRange', 1;
  END;

  /**
   * @validation Future date validation
   * @throw {futureDateNotAllowed}
   */
  IF @dateEnd IS NOT NULL AND @dateEnd > CAST(GETUTCDATE() AS DATE)
  BEGIN
    ;THROW 51000, 'futureDateNotAllowed', 1;
  END;

  /**
   * @validation Movement type validation
   * @throw {invalidMovementType}
   */
  IF @movementType IS NOT NULL AND @movementType NOT IN ('ENTRADA', 'SAIDA', 'ADICAO_PRODUTO', 'ALTERACAO_QUANTIDADE', 'EXCLUSAO')
  BEGIN
    ;THROW 51000, 'invalidMovementType', 1;
  END;

  /**
   * @validation Product existence validation
   * @throw {productDoesntExist}
   */
  IF @idProduct IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM [functional].[product] prd
    WHERE prd.[idProduct] = @idProduct
      AND prd.[idAccount] = @idAccount
  )
  BEGIN
    ;THROW 51000, 'productDoesntExist', 1;
  END;

  /**
   * @validation User existence validation
   * @throw {userDoesntExist}
   */
  IF @idUser IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM [security].[user] usr
    WHERE usr.[idUser] = @idUser
  )
  BEGIN
    ;THROW 51000, 'userDoesntExist', 1;
  END;

  SET @offset = (@page - 1) * @pageSize;

  /**
   * @output {MovementList, n, n}
   * @column {INT} idMovement - Movement identifier
   * @column {INT} idProduct - Product identifier
   * @column {NVARCHAR} productName - Product name
   * @column {VARCHAR} movementType - Movement type
   * @column {NUMERIC} quantity - Movement quantity
   * @column {DATETIME2} dateTime - Movement date and time
   * @column {INT} idUser - User identifier
   * @column {NVARCHAR} userName - User name
   * @column {NVARCHAR} observation - Movement observation
   * @column {NVARCHAR} reason - Deletion reason
   * @column {INT} total - Total count of records
   */
  SELECT
    mov.[idMovement],
    mov.[idProduct],
    ISNULL(prd.[name], mov.[productName]) AS [productName],
    mov.[movementType],
    mov.[quantity],
    mov.[dateTime],
    mov.[idUser],
    usr.[name] AS [userName],
    mov.[observation],
    mov.[reason],
    COUNT(*) OVER() AS [total]
  FROM [functional].[movement] mov
    LEFT JOIN [functional].[product] prd ON (prd.[idAccount] = mov.[idAccount] AND prd.[idProduct] = mov.[idProduct])
    JOIN [security].[user] usr ON (usr.[idUser] = mov.[idUser])
  WHERE mov.[idAccount] = @idAccount
    AND (@dateStart IS NULL OR CAST(mov.[dateTime] AS DATE) >= @dateStart)
    AND (@dateEnd IS NULL OR CAST(mov.[dateTime] AS DATE) <= @dateEnd)
    AND (@idProduct IS NULL OR mov.[idProduct] = @idProduct)
    AND (@movementType IS NULL OR mov.[movementType] = @movementType)
    AND (@idUser IS NULL OR mov.[idUser] = @idUser)
  ORDER BY
    CASE WHEN @orderBy = 'DATA_HORA_ASC' THEN mov.[dateTime] END ASC,
    CASE WHEN @orderBy = 'DATA_HORA_DESC' THEN mov.[dateTime] END DESC
  OFFSET @offset ROWS
  FETCH NEXT @pageSize ROWS ONLY;
END;
GO

-- File: functional/product/spProductStockGet.sql
/**
 * @summary
 * Calculates and retrieves current stock information for a specific product
 * including current quantity, total entries, total exits, last update, and status.
 * 
 * @procedure spProductStockGet
 * @schema functional
 * @type stored-procedure
 * 
 * @endpoints
 * - GET /api/v1/internal/product/:id/stock
 * 
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier for multi-tenancy
 * 
 * @param {INT} idProduct
 *   - Required: Yes
 *   - Description: Product identifier
 * 
 * @testScenarios
 * - Calculate stock for product with movements
 * - Calculate stock for product without movements
 * - Identify product in stock (quantity > 0)
 * - Identify product out of stock (quantity = 0)
 * - Identify inactive/deleted product
 * - Validation failure for non-existent product
 */
CREATE OR ALTER PROCEDURE [functional].[spProductStockGet]
  @idAccount INT,
  @idProduct INT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @currentQuantity NUMERIC(15, 2);
  DECLARE @totalEntries NUMERIC(15, 2);
  DECLARE @totalExits NUMERIC(15, 2);
  DECLARE @lastUpdate DATETIME2;
  DECLARE @status VARCHAR(20);
  DECLARE @deleted BIT;

  /**
   * @validation Required parameter validation
   * @throw {parameterRequired}
   */
  IF @idAccount IS NULL
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  IF @idProduct IS NULL
  BEGIN
    ;THROW 51000, 'idProductRequired', 1;
  END;

  /**
   * @validation Product existence validation
   * @throw {productDoesntExist}
   */
  IF NOT EXISTS (
    SELECT 1
    FROM [functional].[product] prd
    WHERE prd.[idProduct] = @idProduct
      AND prd.[idAccount] = @idAccount
  )
  BEGIN
    ;THROW 51000, 'productDoesntExist', 1;
  END;

  /**
   * @rule {fn-stock-calculation} Calculate current stock from movements
   */
  SELECT
    @totalEntries = ISNULL(SUM(CASE WHEN mov.[movementType] IN ('ENTRADA', 'ADICAO_PRODUTO') THEN mov.[quantity] ELSE 0 END), 0),
    @totalExits = ISNULL(SUM(CASE WHEN mov.[movementType] = 'SAIDA' THEN mov.[quantity] ELSE 0 END), 0),
    @lastUpdate = MAX(mov.[dateTime])
  FROM [functional].[movement] mov
  WHERE mov.[idAccount] = @idAccount
    AND mov.[idProduct] = @idProduct;

  /**
   * @rule {fn-quantity-calculation} Calculate net quantity considering alterations
   */
  WITH [LastAlteration] AS (
    SELECT TOP 1
      mov.[quantity]
    FROM [functional].[movement] mov
    WHERE mov.[idAccount] = @idAccount
      AND mov.[idProduct] = @idProduct
      AND mov.[movementType] = 'ALTERACAO_QUANTIDADE'
    ORDER BY mov.[dateTime] DESC
  )
  SELECT @currentQuantity = ISNULL(
    CASE
      WHEN EXISTS (SELECT 1 FROM [LastAlteration])
      THEN (
        SELECT la.[quantity]
        FROM [LastAlteration] la
      ) + ISNULL((
        SELECT SUM(
          CASE
            WHEN mov.[movementType] = 'ENTRADA' THEN mov.[quantity]
            WHEN mov.[movementType] = 'SAIDA' THEN -mov.[quantity]
            ELSE 0
          END
        )
        FROM [functional].[movement] mov
        WHERE mov.[idAccount] = @idAccount
          AND mov.[idProduct] = @idProduct
          AND mov.[dateTime] > (SELECT TOP 1 mov2.[dateTime] FROM [functional].[movement] mov2 WHERE mov2.[idAccount] = @idAccount AND mov2.[idProduct] = @idProduct AND mov2.[movementType] = 'ALTERACAO_QUANTIDADE' ORDER BY mov2.[dateTime] DESC)
      ), 0)
      ELSE @totalEntries - @totalExits
    END
  , 0);

  /**
   * @rule {fn-status-determination} Determine product status
   */
  SELECT @deleted = prd.[deleted]
  FROM [functional].[product] prd
  WHERE prd.[idProduct] = @idProduct
    AND prd.[idAccount] = @idAccount;

  IF @deleted = 1
  BEGIN
    SET @status = 'INATIVO';
  END
  ELSE IF @currentQuantity > 0
  BEGIN
    SET @status = 'DISPONIVEL';
  END
  ELSE
  BEGIN
    SET @status = 'EM_FALTA';
  END;

  /**
   * @output {ProductStock, 1, n}
   * @column {INT} idProduct - Product identifier
   * @column {NUMERIC} currentQuantity - Current stock quantity
   * @column {NUMERIC} totalEntries - Total entries
   * @column {NUMERIC} totalExits - Total exits
   * @column {DATETIME2} lastUpdate - Last movement date
   * @column {VARCHAR} status - Product status (DISPONIVEL, EM_FALTA, INATIVO)
   */
  SELECT
    @idProduct AS [idProduct],
    @currentQuantity AS [currentQuantity],
    @totalEntries AS [totalEntries],
    @totalExits AS [totalExits],
    @lastUpdate AS [lastUpdate],
    @status AS [status];
END;
GO


-- ============================================
-- Migration completed successfully
-- ============================================

PRINT 'Migration completed successfully!';
GO
